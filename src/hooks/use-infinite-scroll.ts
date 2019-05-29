import { useState, useEffect, MutableRefObject } from 'react';

export const useInfiniteScroll = ({
  ref,
  onLoadMore,
}: {
  onLoadMore: Function;
  ref: MutableRefObject<HTMLElement>;
}) => {
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.addEventListener('scroll', handleScroll);

    return () => {
      ref.current.removeEventListener('scroll', handleScroll);
    };
  }, [ref.current, onLoadMore, isFetching]);

  // loads more if fetching has started
  useEffect(() => {
    if (isFetching) {
      onLoadMore();
    }
  }, [isFetching]);

  function handleScroll() {
    if (ref.current.scrollTop === 0 && isFetching === false) {
      // starts to fetch if scrolled to top and fetching is not in progress
      setIsFetching(true);
    }
  }
};

export default useInfiniteScroll;
