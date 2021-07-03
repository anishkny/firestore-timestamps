const assert = require('chai').assert;
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

it('should write createdAt and updatedAt timestamps', async () => {
  // Write a new document
  const timestamp = new Date();
  const res = await db.collection('test').add({
    x: Math.random().toString(36).slice(2),
  });
  await sleep(1000);

  // Read the document
  const docRef = db.collection('test').doc(res.id);
  const data = (await docRef.get()).data();

  // Check that createdAt and updatedAt are set
  const createdAt = data.createdAt;
  assert.isAtLeast(data.createdAt.toDate(), timestamp);
  assert.isAtLeast(data.updatedAt.toDate(), timestamp);
  assert.equal(data.createdAt.toMillis(), data.updatedAt.toMillis());

  // Update the document
  await docRef.update({ y: Math.random().toString(36).slice(2) });
  await sleep(1000);
  const updatedData = (await docRef.get()).data();

  // Check that updatedAt is updated
  assert.isAtLeast(
    updatedData.updatedAt.toDate(),
    updatedData.createdAt.toDate()
  );

  // Check that createdAt is not updated
  assert.equal(updatedData.createdAt.toMillis(), createdAt.toMillis());
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
