import "./css/info_page.css";

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-bg-shape"></div>
      <div className="hero-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="heroText">
        <h1 className="hero-title">Solve your doubts instantly</h1>
        <p className="hero-subtitle">
          Join the most active academic community at UMA. Ask, answer and grow with your peers.
        </p>
        <div className="hero-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Fast answers</span>
          </div>
          <div className="feature">
            <span className="feature-icon">👥</span>
            <span>Collaborative community</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📚</span>
            <span>Academic resources</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">500+</span>
            <span className="stat-label">Active students</span>
          </div>
          <div className="stat">
            <span className="stat-number">1000+</span>
            <span className="stat-label">Questions solved</span>
          </div>
          <div className="stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Availability</span>
          </div>
        </div>
        <a href="/login" className="btn-main">
          <span className="btn-icon">🚀</span> Explore forum
        </a>
      </div>

      <div className="heroImg">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
          alt="Students collaborating"
        />
        <div className="img-overlay"></div>
        <div className="floating-icons">
          <img src="https://via.placeholder.com/50x50/00c6ff/ffffff?text=📖" alt="Book" className="floating-icon" />
          <img src="https://via.placeholder.com/50x50/0072ff/ffffff?text=💡" alt="Idea" className="floating-icon" />
        </div>
      </div>
    </section>
  );
}
