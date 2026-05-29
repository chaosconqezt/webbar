async function test() {
  const req = await fetch('http://localhost:3000/api/stream?path=' + encodeURIComponent('2008 - Abnormal Exaggeration/cover.jpg'), {
    headers: { 'Range': 'bytes=abc-' }
  });
  console.log(req.status, await req.text());
}
test();
