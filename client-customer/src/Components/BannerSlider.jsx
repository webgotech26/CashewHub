/**
 * BannerSlider.jsx
 * Fetches active banners from GET /api/banners and renders them as a
 * Swiper fade carousel with autoplay and clickable pagination dots.
 *
 * Handles image_url stored as either:
 *   - plain string  → "https://example.com/img.jpg"
 *   - JSON array    → '["https://example.com/img.jpg"]'
 */
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import api from '../services/api';

/* ── Swiper core CSS ────────────────────────────────────────── */
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

/* ── Local override styles ──────────────────────────────────── */
import './BannerSlider.css';

/* ─────────────────────────────────────────────────────────────
   parseImageUrl
   Safely extracts a plain URL string from the DB image_url field.
   ───────────────────────────────────────────────────────────── */
function parseImageUrl(raw) {
  if (raw == null || raw === '') return null;

  // Already a real JS array (edge case)
  if (Array.isArray(raw)) {
    return raw.length > 0 ? String(raw[0]).trim() : null;
  }

  const str = String(raw).trim();

  // JSON array string  e.g. '["https://..."]'
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return String(parsed[0]).trim() || null;
      }
      return null;
    } catch {
      // Fall through — return raw string below
    }
  }

  return str || null;
}

/* ─────────────────────────────────────────────────────────────
   BannerSlider component
   ───────────────────────────────────────────────────────────── */
export default function BannerSlider() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/banners')
      .then(res => {
        /* Filter to active banners only (MySQL TINYINT(1) → number 1) */
        const active = (res.data.data || []).filter(b => Number(b.active) === 1);
        setBanners(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Nothing to render — fail silently so the page isn't disrupted */
  if (loading || banners.length === 0) return null;

  return (
    <section className="banner-slider" aria-label="Promotional banners">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={banners.length > 1}
        speed={700}
        style={{ width: '100%' }}
      >
        {banners.map(banner => {
          const imgSrc = parseImageUrl(banner.image_url);

          return (
            <SwiperSlide key={banner.id}>
              {/* Wrap in link if link_url is provided */}
              {banner.link_url ? (
                <a
                  href={banner.link_url}
                  title={banner.title}
                  style={{ display: 'block', width: '100%' }}
                >
                  <SlideContent imgSrc={imgSrc} title={banner.title} />
                </a>
              ) : (
                <SlideContent imgSrc={imgSrc} title={banner.title} />
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SlideContent — image or text placeholder + caption overlay
   ───────────────────────────────────────────────────────────── */
function SlideContent({ imgSrc, title }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 'clamp(200px, 40vw, 420px)' }}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={title || 'Banner'}
          style={{
            width:      '100%',
            height:     '400px',
            objectFit:  'cover',
            display:    'block',
          }}
          loading="lazy"
        />
      ) : (
        /* Fallback when no image is available */
        <div className="banner-slide__placeholder">{title}</div>
      )}

      {/* Caption overlay */}
      {title && (
        <div className="banner-slide__caption">{title}</div>
      )}
    </div>
  );
}
