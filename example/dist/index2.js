async function a() {
  var $_c;

  try {
    $_c = await handlePromise();
  } catch (e) {
    console.log("handlePromise My name is Dave Jones", e);
  }

  return $_c;
}