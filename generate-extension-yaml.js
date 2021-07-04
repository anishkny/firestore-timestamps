#!/usr/bin/env node
const yaml = require('js-yaml');
const fs = require('fs');

const MAX_DEPTH = require('./functions/constants').MAX_DEPTH;
const version = require('./package.json').version;

const resources = [];

// Construct a pair of writeCreatedAtDepth{i} and writeUpdatedAt{i} for each depth
// from 0 to MAX_DEPTH-1
for (let i = 0; i < MAX_DEPTH; i++) {
  // Construct document path for this depth
  let documentPath = '';
  for (let j = 0; j <= i; j++) {
    documentPath += `/{col${j}}/{doc${j}}`;
  }
  documentPath = documentPath.slice(1); // Remove leading slash

  // Construct functions to write the createdAt and updatedAt for this depth
  resources.push(
    {
      name: `writeCreatedAtDepth${i}`,
      type: 'firebaseextensions.v1beta.function',
      properties: {
        location: '${LOCATION}',
        eventTrigger: {
          eventType: 'providers/cloud.firestore/eventTypes/document.create',
          resource: `projects/\${PROJECT_ID}/databases/(default)/documents/${documentPath}`,
        },
      },
    },
    {
      name: `writeUpdatedAtDepth${i}`,
      type: 'firebaseextensions.v1beta.function',
      properties: {
        location: '${LOCATION}',
        eventTrigger: {
          eventType: 'providers/cloud.firestore/eventTypes/document.update',
          resource: `projects/\${PROJECT_ID}/databases/(default)/documents/${documentPath}`,
        },
      },
    }
  );
}

const data = {
  name: 'firestore-timestamps',
  version,
  specVersion: 'v1beta',
  displayName: 'Firestore Timestamps',
  description:
    'Automatically write createdAt and updatedAt timestamps in Firestore documents',
  license: 'Apache-2.0',
  author: {
    authorName: 'Anish Karandikar',
    email: 'anishkny@gmail.com',
    url: 'https://github.com/anishkny',
  },
  resources,
  params: [
    {
      param: 'LOCATION',
      label: 'Cloud Functions location',
      description:
        'The location where you want to deploy Cloud Functions. For more help, see: https://firebase.google.com/docs/functions/locations',
      type: 'select',
      options: getLocations().map((e) => {
        return { label: e, value: e.split(' ')[0] };
      }),
      default: 'us-central1',
      required: true,
      immutable: true,
    },
  ],
};

console.log(yaml.dump(data));

// Write YAML to file
fs.writeFileSync('./extension.yaml', yaml.dump(data));
console.log('Wrote to ./extension.yaml');

// Make a copy in example-extension.yaml
fs.writeFileSync('./example-extension.yaml', yaml.dump(data));

function getLocations() {
  return [
    'us-central1 (Iowa)',
    'us-east1 (South Carolina)',
    'us-east4 (Northern Virginia)',
    'europe-west1 (Belgium)',
    'europe-west2 (London)',
    'asia-east2 (Hong Kong)',
    'asia-northeast1 (Tokyo)',
    'asia-northeast2 (Osaka)',
    'us-west2 (Los Angeles)',
    'us-west3 (Salt Lake City)',
    'us-west4 (Las Vegas)',
    'europe-central2 (Warsaw)',
    'europe-west3 (Frankfurt)',
    'europe-west6 (Zurich)',
    'northamerica-northeast1 (Montreal)',
    'southamerica-east1 (Sao Paulo)',
    'australia-southeast1 (Sydney)',
    'asia-south1 (Mumbai)',
    'asia-southeast2 (Jakarta)',
    'asia-northeast3 (Seoul)',
  ];
}
