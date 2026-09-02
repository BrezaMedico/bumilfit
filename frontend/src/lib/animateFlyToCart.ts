export const animateFlyToCart = (clickedElement: HTMLElement, targetId: string) => {
  const targetElement = document.getElementById(targetId);
  if (!clickedElement || !targetElement) return;

  // 1. Dapatkan posisi koordinat relatif terhadap viewport
  const originRect = clickedElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  const startX = originRect.left + originRect.width / 2;
  const startY = originRect.top + originRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  // 2. Buat partikel terbang sementara
  const particle = document.createElement('div');
  particle.style.position = 'fixed';
  particle.style.left = `${startX - 10}px`;
  particle.style.top = `${startY - 10}px`;
  particle.style.width = '20px';
  particle.style.height = '20px';
  particle.style.borderRadius = '50%';
  particle.style.backgroundColor = '#389D9C'; // Warna Teal utama
  particle.style.zIndex = '9999';
  particle.style.pointerEvents = 'none';
  particle.style.boxShadow = '0 0 10px rgba(56, 157, 156, 0.6)';

  document.body.appendChild(particle);

  // 3. Animasi menggunakan Web Animations API (Parabolic trajectory)
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  
  // Tentukan titik puncak parabola (naik sedikit terlebih dahulu agar dramatis)
  const peakY = Math.min(startY, endY) - 60; 

  const animation = particle.animate([
    {
      transform: 'translate(0, 0) scale(1)',
      opacity: '1',
      offset: 0
    },
    {
      transform: `translate(${deltaX * 0.35}px, ${peakY - startY}px) scale(0.9)`,
      opacity: '0.9',
      offset: 0.35
    },
    {
      transform: `translate(${deltaX}px, ${deltaY}px) scale(0.3)`,
      opacity: '0',
      offset: 1
    }
  ], {
    duration: 650,
    easing: 'cubic-bezier(0.25, 1, 0.50, 1)'
  });

  // 4. Bersihkan DOM dan jalankan feedback pantulan pada target
  animation.onfinish = () => {
    particle.remove();

    targetElement.classList.add('animate-fab-bounce');
    setTimeout(() => {
      targetElement.classList.remove('animate-fab-bounce');
    }, 400);
  };
};
