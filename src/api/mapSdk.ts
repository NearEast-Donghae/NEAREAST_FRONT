let sdkPromise: Promise<void> | null = null;

export function loadKakaoSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!appKey) return Promise.reject(new Error('지도를 사용할 수 없어요. 장소 목록에서 계속 찾아볼 수 있어요.'));
  const attempt = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => fail(), 12000);
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('지도를 불러오지 못했어요. 잠시 후 다시 시도하거나 장소 목록을 이용해 주세요.'));
    };
    // services: 역 이름으로 좌표를 찾는 장소 검색(움직이는 철도 지도에서 사용)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.onload = () => {
      if (!window.kakao?.maps?.load) { fail(); return; }
      window.kakao.maps.load(() => { window.clearTimeout(timeout); resolve(); });
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  sdkPromise = attempt.catch((error) => { sdkPromise = null; throw error; });
  return sdkPromise;
}
