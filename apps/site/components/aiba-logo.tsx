/** Logo de AIBA: «a» con estrella en el círculo violeta + «aiba» con la estrella en el punto de la «i». */
const AIBA_A = "M25.8525390625 46.4296875C29.1826171875 46.4296875 31.5029296875 45.09765625 32.8134765625 42.626953125H33.0068359375V46.0H40.0537109375V29.693359375C40.0537109375 24.537109375 35.3486328125 21.6796875 29.3759765625 21.6796875C23.3603515625 21.6796875 19.5791015625 24.494140625 18.6337890625 28.59765625L25.4228515625 29.478515625C25.8310546875 27.974609375 27.2275390625 27.0078125 29.3115234375 27.0078125C31.3525390625 27.0078125 32.5771484375 27.953125 32.5771484375 29.607421875V29.693359375C32.5771484375 31.17578125 30.9443359375 31.4765625 26.8837890625 31.8203125C22.0283203125 32.228515625 17.9462890625 34.01171875 17.9462890625 39.33984375C17.9462890625 44.087890625 21.2333984375 46.4296875 25.8525390625 46.4296875ZM28.1298828125 41.466796875C26.3251953125 41.466796875 25.0361328125 40.607421875 25.0361328125 38.99609375C25.0361328125 37.40625 26.2822265625 36.4609375 28.4951171875 36.138671875C29.8916015625 35.923828125 31.7822265625 35.6015625 32.6416015625 35.150390625V37.44921875C32.6416015625 39.8125 30.6435546875 41.466796875 28.1298828125 41.466796875Z";
const AIBA_STAR = "M12 0l3.2 8.8L24 12l-8.8 3.2L12 24l-3.2-8.8L0 12l8.8-3.2z";

export function AibaMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="AIBA">
      <circle cx="32" cy="32" r="32" fill="#7c3aed" />
      <path transform="translate(40 9) scale(0.55)" d={AIBA_STAR} fill="#fff" />
      <path d={AIBA_A} fill="#fff" />
    </svg>
  );
}

export function AibaLogo({ size = 32, className }: { size?: number; className?: string }) {
  const fs = Math.round(size * 0.72);
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <AibaMark size={size} />
      <span aria-hidden className="inline-flex items-baseline font-extrabold tracking-[-0.03em] leading-none text-neutral-900 dark:text-neutral-100" style={{ fontSize: fs }}>
        a
        <span className="relative inline-block">
          ı
          <svg width={Math.round(fs * 0.36)} height={Math.round(fs * 0.36)} viewBox="0 0 24 24" aria-hidden className="absolute left-1/2 -translate-x-1/2 text-violet-600 dark:text-violet-400" style={{ top: -Math.round(fs * 0.08) }}>
            <path d={AIBA_STAR} fill="currentColor" />
          </svg>
        </span>
        ba
      </span>
    </span>
  );
}
