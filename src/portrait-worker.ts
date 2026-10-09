self.onmessage = async ({ data: job }) => {
  const report = (type: string, message?: string) =>
    self.postMessage({ type, message });
  try {
    report(
      "progress",
      "Loading portrait matting… first use downloads the model from Toolinger.",
    );
    const { AutoModel, AutoImageProcessor, RawImage, env } =
      await import("@huggingface/transformers");
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = job.base + "models/";
    env.useBrowserCache = true;
    if (env.backends.onnx.wasm) {
      env.backends.onnx.wasm.numThreads = 1;
      env.backends.onnx.wasm.proxy = false;
      env.backends.onnx.wasm.wasmPaths = {
        mjs: job.base + "portrait-runtime/ort-wasm-simd-threaded.mjs",
        wasm: job.base + "portrait-runtime/ort-wasm-simd-threaded.wasm",
      };
    }
    const options = {
      local_files_only: true,
      dtype: "fp32" as const,
      device: "wasm" as const,
      progress_callback: (p: any) => {
        if (p.status === "progress" && p.file?.endsWith(".onnx"))
          report(
            "progress",
            `Downloading portrait model: ${Math.round(p.progress || 0)}%`,
          );
      },
    };
    const [model, processor] = await Promise.all([
      AutoModel.from_pretrained("modnet", options),
      AutoImageProcessor.from_pretrained("modnet", { local_files_only: true }),
    ]);
    report("progress", "Refining the portrait edges and hair…");
    const original = await RawImage.read(job.file);
    const scale = Math.min(1, 1024 / Math.max(original.width, original.height));
    const image =
      scale < 1
        ? await original.resize(
            Math.round(original.width * scale),
            Math.round(original.height * scale),
          )
        : original;
    const { pixel_values } = await processor(image);
    const result = await model({ input: pixel_values });
    const mask = await RawImage.fromTensor(
      result.output[0].mul(255).to("uint8"),
    ).resize(image.width, image.height);
    const output = image.clone().putAlpha(mask);
    let transparent = 0,
      solid = 0;
    for (let i = 3; i < output.data.length; i += 4) {
      if (output.data[i] < 20) {
        output.data[i] = 0;
        transparent++;
      } else if (output.data[i] > 235) {
        output.data[i] = 255;
        solid++;
      }
    }
    if (!transparent || !solid)
      throw new Error(
        "No clear foreground and background found. Try a well-lit portrait or plain-wall removal.",
      );
    const blob = await output.toBlob();
    await model.dispose();
    self.postMessage({ type: "result", blob });
  } catch (error) {
    report(
      "error",
      error instanceof Error
        ? error.message
        : "Portrait matting could not run on this device.",
    );
  }
};
