import Calculator from '../components/Calculator';

export default function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Find your best cashback card in the UAE</h1>
      <p style={{ color: '#555', marginBottom: '2rem' }}>
        Enter your monthly spending below and we'll rank every cashback card by what you'd actually earn.
      </p>
      <Calculator />
    </div>
  );
}
