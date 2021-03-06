const assert = require('chai').assert;
const admin = require('firebase-admin');
const MAX_DEPTH = require('./constants').MAX_DEPTH;

admin.initializeApp();
const db = admin.firestore();

it('should write createdAt and updatedAt timestamps at each depth', async () => {
  // For each depth level, we create a document and check the timestamps
  let docRef = null;
  for (let i = 0; i < MAX_DEPTH; i++) {
    console.log(`Testing at depth ${i}`);
    const timestamp = new Date();

    // Write a new document at this depth
    if (!docRef) {
      docRef = db.collection('test').doc();
    } else {
      docRef = docRef.collection('test').doc();
    }
    await docRef.set({
      x: Math.random().toString(36).slice(2),
    });

    // Read the document
    const data = await poll(
      () => docRef.get().then((d) => d.data()),
      (d) => d.createdAt && d.updatedAt
    );

    // Check that createdAt and updatedAt are set
    const createdAt = data.createdAt;
    assert.isAtLeast(data.createdAt.toDate(), timestamp, data.createdAt);
    assert.isAtLeast(data.updatedAt.toDate(), timestamp, data.updatedAt);
    assert.equal(data.createdAt.toMillis(), data.updatedAt.toMillis());

    // Update the document
    await docRef.update({ y: Math.random().toString(36).slice(2) });

    // Read updated document
    const updatedData = await poll(
      () => docRef.get().then((d) => d.data()),
      (d) =>
        d.createdAt &&
        d.updatedAt &&
        d.updatedAt.toMillis() > d.createdAt.toMillis()
    );

    // Check that updatedAt is updated
    assert.isAtLeast(
      updatedData.updatedAt.toDate(),
      updatedData.createdAt.toDate()
    );

    // Check that createdAt is not updated
    assert.equal(updatedData.createdAt.toMillis(), createdAt.toMillis());
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function poll(f, condition) {
  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    const res = await f();
    if (condition(res)) {
      return res;
    }
  }
  throw new Error('Timeout');
}
