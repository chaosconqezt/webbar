async function test() {
  const req = await fetch('http://localhost:3000/api/manage/folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': 'admin_mode=root_master' }, // admin check might be overridden though, whatever
    body: JSON.stringify({ path: ["array!"], name: "test" })
  });
  console.log(req.status, await req.text());
}
test();
