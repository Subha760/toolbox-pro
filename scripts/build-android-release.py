"""Build locally using an owner-held key. Never prints signing credentials."""
import os,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
keys=Path(os.environ.get('TOOLINGER_SIGNING_DIR','/workspace/private-toolinger-signing'))
env=os.environ.copy()
env.update(TOOLINGER_KEYSTORE=str(keys/'toolinger-release.jks'),TOOLINGER_STORE_PASSWORD=(keys/'store-password').read_text().strip(),TOOLINGER_KEY_PASSWORD=(keys/'key-password').read_text().strip(),TOOLINGER_KEY_ALIAS=(keys/'alias').read_text().strip())
subprocess.run(['./gradlew','assembleRelease','bundleRelease','--console=plain'],cwd=root/'android',env=env,check=True)
