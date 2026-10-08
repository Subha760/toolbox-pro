import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePageSelection, securePassword, portraitLayout, sheetLayout} from '../src/tool-utils.mjs';
test('PDF reorder preserves requested order and supports ranges', () => {assert.deepEqual(parsePageSelection('3,1-2',3),[2,0,1]);assert.deepEqual(parsePageSelection('2,2,1',3),[1,0]);});
test('PDF invalid pages never silently disappear',()=>{for(const raw of ['', '0', '4', '3-1', '1,x', '2-5']) assert.throws(()=>parsePageSelection(raw,3));});
test('secure passwords honour all selected character groups',()=>{for(let i=0;i<100;i++){const p=securePassword(16,['ABC','abc','012','!@#']);assert.equal(p.length,16);for(const group of [/[ABC]/,/[abc]/,/[012]/,/[!@#]/])assert.match(p,group);}assert.throws(()=>securePassword(16,[]));});
test('portrait zoom and pan fill output without exposing empty edges',()=>{const p=portraitLayout(1000,500,413,531,120,100,0);assert.ok(p.drawWidth>=413);assert.ok(p.drawHeight>=531);assert.equal(p.dx,413-p.drawWidth);assert.ok(Math.abs(p.dy)<1e-9);});
test('print sheet preserves size with margins on 4x6 paper',()=>{const s=sheetLayout(413,531);assert.equal(s.positions.length,6);for(const p of s.positions){assert.ok(p.x>=30&&p.y>=30);assert.ok(p.x+413<=1170&&p.y+531<=1770);}assert.equal(sheetLayout(4000,4000).positions.length,0);});
