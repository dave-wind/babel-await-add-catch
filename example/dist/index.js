function handlePromise() {}

const demo = async () => {
  var $_b;
  var dddd = 1;

  try {
    $_b = await handlePromise();
  } catch (e) {
    console.log("handlePromise My name is Dave Jones", e);
  }

  return dddd + $_b;
};

async function demo2() {
  var $_c;

  try {
    $_c = await handlePromise();
  } catch (e) {
    console.log("handlePromise My name is Dave Jones", e);
  }

  return $_c;
}