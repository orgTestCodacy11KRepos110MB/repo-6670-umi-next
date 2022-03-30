import React, { useEffect, useState } from 'react';

export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      fetch('/__umi/api/app-data')
        .then((res) => res.json())
        .then(setData);
    })();
  });
  if (!data) {
    return null;
  }
  return (
    <div>
      <h2>AppData</h2>
      <div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
