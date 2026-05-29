async function test() {
  const res = await fetch('http://localhost:3000/api/stream?path[]=foo');
  console.log(res.status, await res.text());
}
test();
