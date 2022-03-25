import React from 'react';
import { useLoaderData } from 'umi';

export default () => {
  const d = useLoaderData();
  return (
    <div style={{ borderWidth: 2, padding: 10 }}>
      <h1>User data</h1>
      <p>loader data: {JSON.stringify(d)}</p>
    </div>
  );
};

export async function loader() {
  return { message: 'data from server loader of users/user.tsx' };
}

export async function clientLoader() {
  return { message: 'data from client loader of users/user.tsx' };
}
