// Tico's section heading: a big Didot word over a full-width black line.
export default function SectionTitle({ children, note }) {
  return (
    <div className="flex flex-col items-center mb-12 w-full">
      <h2 className="text-primary text-[48px] md:text-[8vh] font-didot font-normal tracking-tighter text-center leading-tight">
        {children}
      </h2>
      <div className="w-[90vw] max-w-full h-[2px] bg-black mt-4" />
      {note ? <p className="mt-3 text-text-muted text-center">{note}</p> : null}
    </div>
  );
}
