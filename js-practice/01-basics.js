const schoolName =  "Green Valley College";
let studentCount = 3;
studentCount = studentCount + 1;

const name ="Asha";
const marks = 82;
const ispassed =  true;
const subjects =["Math","Physics"];
const student ={id:1,name:"Asha", marks:82};
const address = null;

console.log(schoolName, studentCount);
console.log(typeof name, typeof marks, typeof ispassed, typeof subjects, typeof student, address);

if (marks >=90) {
    console.log("Grade A");
}else if (marks >=75){
    console.log("Grade B");
}else{
    console.log("Grade C");
}

for (let i = 0;i<subjects.length;i++){
    console.log("Subject:",subjects[i]);
}
for (const subject of subjects){
    console.log("Again:", subject);
}
function add(a,b){
    return a+b;
}
const multiply = (a,b)=> a*b;
console.log(add(2,3),multiply(2,3));