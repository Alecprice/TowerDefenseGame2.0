import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router does not reset scroll position on navigation by default.
// Without this, clicking a link near the bottom of a tall page (e.g. the
// map list on HomePage) leaves the browser scrolled to that same pixel
// position on the next page, which can make it look like the previous
// screen's content is still there. Resetting scroll on every route change
// guarantees each page is seen fresh, from the top, like its own screen.
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
