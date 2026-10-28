import describe,{greet,total}from "./utils.mjs";
const student = {id: 1, name:"Asha",marks:82};
console.log(greet(student.name));
console.log(describe(student));
console.log(total(10,20,30));

const [first,second]=["Math","Physics","chemistry"];
console.log(first,second);

const updated = {...student,marks:90 };
console.log(student.marks,updated.marks);

console.log([...["a", "b"],...["c"]]);
