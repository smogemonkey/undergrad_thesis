// import { getNodesBounds } from '@xyflow/react';
 
// const nodes = [
//   {
//     id: 'a',
//     position: { x: 0, y: 0 },
//     data: { label: 'a' },
//     width: 50,
//     height: 25,
//   },
//   {
//     id: 'b',
//     position: { x: 100, y: 100 },
//     data: { label: 'b' },
//     width: 50,
//     height: 25,
//   },
// ];
 
// const bounds = getNodesBounds(nodes);
// console.log(bounds);

const obj = {
  id: 1,
  dependsOn: [

  ]
}

const depends = obj.dependsOn;
const arr = [2,3,4];
depends.push(...arr);
console.log(obj);