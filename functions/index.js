const functions = require('firebase-functions');
const admin = require('firebase-admin');
const equal = require('fast-deep-equal');

// Construct document paths for each depth level
// e.g. '{col0}/{doc0}', '{col0}/{doc0}/{col1}/{doc1}', ...
const MAX_DEPTH = 5;
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
  module.exports[`writeCreatedAtDepth${i}`] = constructCreatedAtWriter(
    documentPaths[i]
  );
  module.exports[`writeUpdatedAtDepth${i}`] = constructUpdatedAtWriter(
    documentPaths[i]
  );
}

// Given a document path, create function to write createdAt
function constructCreatedAtWriter(documentPath) {
  return functions.firestore
    .document(documentPath)
    .onCreate((snap, context) => {
      return snap.ref.update({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
}

// Given a document path, create function to write updatedAt
function constructUpdatedAtWriter(documentPath) {
  return functions.firestore
    .document(documentPath)
    .onUpdate((change, context) => {
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
