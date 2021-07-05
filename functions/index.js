const functions = require('firebase-functions');
const admin = require('firebase-admin');
const equal = require('fast-deep-equal');
const MAX_DEPTH = require('./constants').MAX_DEPTH;

admin.initializeApp();

// Construct document paths for each depth level
// e.g. '{col0}/{doc0}', '{col0}/{doc0}/{col1}/{doc1}', ...
const documentPaths = [];
for (let i = 0; i < MAX_DEPTH; i++) {
  let documentPath = '';
  for (let j = 0; j <= i; j++) {
    documentPath += `/{col${j}}/{doc${j}}`;
  }
  documentPaths.push(documentPath.slice(1));
}

// For each depth, create a function that writes createdAt and updatedAt
for (let i = 0; i < documentPaths.length; i++) {
  module.exports[`writeCreatedAtDepth${i}`] = constructCreatedAtWriter();
  module.exports[`writeUpdatedAtDepth${i}`] = constructUpdatedAtWriter();
}

// Given a document path, create function to write createdAt
function constructCreatedAtWriter() {
  return functions.handler.firestore.document.onCreate((snap) =>
    snap.ref.update({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  );
}

// Given a document path, create function to write updatedAt
function constructUpdatedAtWriter() {
  return functions.handler.firestore.document.onUpdate((change) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Underlying data didn't change, don't do anything
    if (
      equal(
        { ...beforeData, createdAt: 0, updatedAt: 0 },
        { ...afterData, createdAt: 0, updatedAt: 0 }
      )
    ) {
      return null;
    }

    // Underlying data changed, update timestamp
    return change.after.ref.set(
      {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}
