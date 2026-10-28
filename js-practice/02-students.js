const students = [
  { id: 1, name: "Asha", marks: 82 },
  { id: 2, name: "Ravi", marks: 67 },
  { id: 3, name: "Neha", marks: 91 },
  { id: 4, name: "Kiran", marks: 55 },
];

// filter: keep students with marks >= 70
const passed = students.filter((s) => s.marks >= 70);
console.log("Passed:", passed);

// find: search by id
const found = students.find((s) => s.id === 3);
console.log("Found:", found);

// some: is anyone below 60?
console.log("Anyone below 60?", students.some((s) => s.marks < 60));

// reduce: average marks
const average = students.reduce((sum, s) => sum + s.marks, 0) / students.length;
console.log("Average:", average);

// sort alphabetically (copy first with spread so the original isn't changed)
const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));
console.log("Sorted:", sorted.map((s) => s.name));

// map: transform into another structure
const options = students.map(({ id, name }) => ({ value: id, label: name }));
console.log("Options:", options);

// async function + try/catch
const getStudent = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const s = students.find((x) => x.id === id);
      s ? resolve(s) : reject(new Error("Student not found"));
    }, 500);
  });

async function main() {
  try {
    console.log("Async result:", await getStudent(2));
    console.log(await getStudent(99));
  } catch (err) {
    console.log("Error caught:", err.message);
  }
  console.log("Optional chaining:", students[10]?.name ?? "No such student");
  console.log("JSON:", JSON.stringify(students[0]), JSON.parse('{"a":1}'));
}
main();