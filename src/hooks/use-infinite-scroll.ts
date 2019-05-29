import { useState, useEffect, MutableRefObject } from 'react';

export const useInfiniteScroll = ({
  ref,
  onLoadMore,
}: {
  onLoadMore: Function;
  ref: MutableRefObject<HTMLElement>;
}) => {
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.addEventListener('scroll', handleScroll);

    return () => {
      ref.current.removeEventListener('scroll', handleScroll);
    };
  }, [ref.current, onLoadMore]);

  function handleScroll() {
    if (ref.current.scrollTop === 0) {
      // loads more if scrolled to top
      onLoadMore();
    }
  }
};

export default useInfiniteScroll;
