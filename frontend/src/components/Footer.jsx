export default function Footer() {
    return (
        <footer className="bg-background border-t border-secondary/20">
            <div className="container mx-auto px-4 py-4 text-center text-sm text-secondary">
                © {new Date().getFullYear()}{" "}
                <span className="text-primary font-semibold">StudySync</span>. Built for focus ✨
            </div>
        </footer>
    );
}
