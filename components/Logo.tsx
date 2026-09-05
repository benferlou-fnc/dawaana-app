import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt="Dawaana"
        width={36}
        height={36}
        className="w-9 h-9 rounded-[10px] object-cover flex-none"
      />
      <span className="font-display font-bold text-xl text-brand-ink">Dawaana</span>
    </Link>
  );
}
