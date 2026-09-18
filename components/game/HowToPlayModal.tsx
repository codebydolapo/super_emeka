"use client";

interface Props {
  onBack: () => void;
}

export default function HowToPlayModal({ onBack }: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black/90 p-4">
      <div className="pixel-border bg-[#12122a] max-w-md w-full p-5 text-white space-y-4 max-h-full overflow-y-auto">
        <h2 className="text-sm sm:text-base text-naija-yellow text-center mb-2">
          HOW TO PLAY
        </h2>

        <section className="space-y-2 text-[10px] sm:text-xs leading-relaxed">
          <p className="text-naija-green font-bold">🎮 CONTROLS</p>
          <p>Desktop: Arrow Keys / WASD to move &amp; crouch, Space to jump, X to throw.</p>
          <p>Mobile: Use the on-screen D-Pad, A to jump, B to throw a slipper.</p>
        </section>

        <section className="space-y-2 text-[10px] sm:text-xs leading-relaxed">
          <p className="text-naija-green font-bold">🎯 GOAL</p>
          <p>
            Race across Lagos through 10 stages, each longer and tougher than
            the last. Bypass the Agbero &quot;traffic gridlock&quot; barricades and
            board the yellow Danfo bus — watch for the bouncing arrow marking
            it — before time runs out.
          </p>
        </section>

        <section className="space-y-2 text-[10px] sm:text-xs leading-relaxed">
          <p className="text-naija-green font-bold">🩴 SLIPPER THROW</p>
          <p>
            Throw a slipper to take down enemies from a distance. It has a
            cooldown (watch the bar above your head) so you can&apos;t just spam
            it — jumping and stomping is still the main way through.
          </p>
        </section>

        <section className="space-y-2 text-[10px] sm:text-xs leading-relaxed">
          <p className="text-naija-green font-bold">⚠️ HAZARDS</p>
          <p>
            Avoid open drainages &amp; potholes, and watch for Hawkers and
            Agberos — stomp on their heads or hit them with a slipper to
            defeat them!
          </p>
        </section>

        <section className="space-y-2 text-[10px] sm:text-xs leading-relaxed">
          <p className="text-naija-green font-bold">📦 ITEMS</p>
          <p>Hit &quot;?&quot; blocks for Naira coins, Suya (+1 Health), or Cold Zobo (speed boost)!</p>
        </section>

        <button
          onClick={onBack}
          className="w-full mt-2 py-3 bg-naija-yellow text-black text-xs border-2 border-black shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-transform"
        >
          ⬅ BACK
        </button>
      </div>
    </div>
  );
}
