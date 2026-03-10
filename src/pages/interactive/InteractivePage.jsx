// ── Animation CSS ──────────────────────────────────────────
const ANIM_CSS = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
`

const FEATURES = [
  {
    icon: "🗺️",
    title: "Peta Interaktif",
    desc: "Navigasi kawasan IKN dengan peta digital yang responsif dan mudah digunakan.",
  },
  {
    icon: "📋",
    title: "Direktori Layanan",
    desc: "Temukan layanan pemerintahan, fasilitas publik, dan titik-titik penting di IKN.",
  },
  {
    icon: "📰",
    title: "Berita & Pengumuman",
    desc: "Informasi terkini seputar pembangunan dan kegiatan di Ibu Kota Nusantara.",
  },
  {
    icon: "🎯",
    title: "Panduan Wisata",
    desc: "Jelajahi destinasi, rute, dan rekomendasi tempat menarik di kawasan IKN.",
  },
  {
    icon: "📞",
    title: "Kontak Darurat",
    desc: "Akses cepat nomor darurat, rumah sakit, dan layanan keamanan setempat.",
  },
  {
    icon: "🏛️",
    title: "Profil Kawasan",
    desc: "Informasi lengkap tentang zona-zona utama dan masterplan pembangunan IKN.",
  },
]

export default function InteractivePage() {
  return (
    <div style={S.page}>
      <style>{ANIM_CSS}</style>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroBadge}>
          <span style={S.heroBadgeDot} />
          Dalam Pengembangan
        </div>

        <div style={S.heroIcon}>🖥️</div>

        <h1 style={S.heroTitle}>Fitur Interaktif</h1>
        <p style={S.heroSubtitle}>
          Kami sedang membangun pengalaman interaktif yang luar biasa untuk kiosk IKN.
          Fitur-fitur di bawah ini akan segera hadir dan siap melayani masyarakat.
        </p>

        <div style={S.heroMeta}>
          <div style={S.heroMetaItem}>
            <span style={S.heroMetaDot} />
            Peluncuran segera
          </div>
          <div style={S.heroMetaItem}>
            <span style={{ ...S.heroMetaDot, background: "#C49A3C" }} />
            6 fitur utama
          </div>
          <div style={S.heroMetaItem}>
            <span style={{ ...S.heroMetaDot, background: "#2D6A4F" }} />
            Layanan 24/7
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>Fitur yang Akan Hadir</h2>
        <p style={S.sectionSub}>Semua fitur dirancang khusus untuk kebutuhan masyarakat IKN</p>
      </div>

      <div style={S.grid}>
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            style={{ ...S.featureCard, animationDelay: `${i * 0.07}s` }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, S.featureCardHover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { ...S.featureCard, animationDelay: `${i * 0.07}s` })}
          >
            <div style={S.featureIconWrap}>
              <span style={S.featureIcon}>{f.icon}</span>
            </div>
            <h3 style={S.featureTitle}>{f.title}</h3>
            <p style={S.featureDesc}>{f.desc}</p>
            <div style={S.featureTag}>Segera Hadir</div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={S.footerNote}>
        <span style={S.footerIcon}>💡</span>
        <p style={S.footerText}>
          Ingin memberikan masukan untuk fitur interaktif? Hubungi tim pengembangan melalui menu Pengaturan.
        </p>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────
const S = {
  page: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    color: "#1A1A18",
    width: "100%",
    animation: "fadeUp 0.4s ease both",
  },

  // Hero
  hero: {
    background: "#FFFFFF",
    border: "1px solid #E5E0D8",
    borderRadius: "16px",
    padding: "48px 32px",
    textAlign: "center",
    marginBottom: "32px",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(196,154,60,0.12)",
    border: "1px solid rgba(196,154,60,0.3)",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#9B7228",
    letterSpacing: "0.5px",
    marginBottom: "24px",
  },
  heroBadgeDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#C49A3C",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  heroIcon: {
    fontSize: "56px",
    lineHeight: 1,
    marginBottom: "20px",
    display: "block",
    animation: "float 3s ease-in-out infinite",
  },
  heroTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "32px",
    fontWeight: 700,
    color: "#1A1A18",
    margin: "0 0 14px",
    letterSpacing: "0.5px",
  },
  heroSubtitle: {
    fontSize: "15px",
    color: "#7A7670",
    lineHeight: 1.7,
    margin: "0 auto 24px",
    maxWidth: "520px",
    fontWeight: 300,
  },
  heroMeta: {
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    flexWrap: "wrap",
  },
  heroMetaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#8A8680",
    fontWeight: 500,
  },
  heroMetaDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#C0392B",
    flexShrink: 0,
  },

  // Section header
  sectionHeader: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 4px",
  },
  sectionSub: {
    fontSize: "13px",
    color: "#8A8680",
    margin: 0,
    fontWeight: 300,
  },

  // Feature grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "14px",
    marginBottom: "28px",
  },
  featureCard: {
    background: "#FFFFFF",
    border: "1px solid #E5E0D8",
    borderRadius: "12px",
    padding: "24px",
    animation: "fadeUp 0.4s ease both",
    transition: "all 0.2s",
    cursor: "default",
  },
  featureCardHover: {
    background: "#FFFFFF",
    border: "1px solid #C49A3C",
    borderRadius: "12px",
    padding: "24px",
    animation: "fadeUp 0.4s ease both",
    transition: "all 0.2s",
    cursor: "default",
    boxShadow: "0 4px 20px rgba(196,154,60,0.12)",
    transform: "translateY(-2px)",
  },
  featureIconWrap: {
    width: "48px",
    height: "48px",
    background: "#F9F6F1",
    border: "1px solid #E5E0D8",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  },
  featureIcon: {
    fontSize: "22px",
    lineHeight: 1,
  },
  featureTitle: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1A1A18",
    margin: "0 0 8px",
  },
  featureDesc: {
    fontSize: "12px",
    color: "#7A7670",
    lineHeight: 1.6,
    margin: "0 0 14px",
    fontWeight: 300,
  },
  featureTag: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 600,
    background: "rgba(45,106,79,0.08)",
    color: "#2D6A4F",
    border: "1px solid rgba(45,106,79,0.2)",
    borderRadius: "4px",
    padding: "2px 8px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  // Footer note
  footerNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "#F9F6F1",
    border: "1px solid #E5E0D8",
    borderRadius: "10px",
    padding: "16px 20px",
  },
  footerIcon: {
    fontSize: "18px",
    lineHeight: 1,
    flexShrink: 0,
    marginTop: "2px",
  },
  footerText: {
    fontSize: "13px",
    color: "#7A7670",
    margin: 0,
    lineHeight: 1.6,
  },
}
