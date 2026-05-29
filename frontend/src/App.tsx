export default function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">
          <span className="app__prompt">$</span>
          <span className="cursor">satellitesnap</span>
        </h1>
        <p className="app__tagline">
          freshest satellite imagery for any address or coordinates
        </p>
      </header>

      <section className="app__body">
        <div className="window">
          <div className="window__bar">
            <span className="window__dots">
              <span className="window__dot window__dot--r" />
              <span className="window__dot window__dot--y" />
              <span className="window__dot window__dot--g" />
            </span>
            <span>satellitesnap — recon console</span>
          </div>
          <div className="window__body">
            <p className="app__placeholder">// interface bootstrapping…</p>
          </div>
        </div>
      </section>
    </main>
  );
}
