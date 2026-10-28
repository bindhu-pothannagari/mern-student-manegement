export const greet = (name) => `Hello, ${name}!`;

// rest syntax: collects any number of arguments into an array
export const total = (...numbers) => numbers.reduce((sum, n) => sum + n, 0);

export default function describe(student) {
  const { name, marks } = student; // object destructuring
  return `${name} scored ${marks}`;
}