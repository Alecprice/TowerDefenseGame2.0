export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Golden Glaze Mochi Donuts
      </div>
    </footer>
  );
}
