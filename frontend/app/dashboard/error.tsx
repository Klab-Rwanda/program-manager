"use client"

export default function Error({ error }: { error: Error }) {
  return (
    <div style={{ padding: 32, color: 'red' }}>
      <h1>Dashboard Error</h1>
      <pre>{error.message}</pre>
      <p>Check your code for runtime or import errors.</p>
    </div>
  )
} 