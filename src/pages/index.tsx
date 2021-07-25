import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';
import Head from 'next/head';
import Link from 'next/link';
import { FiUser, FiCalendar } from "react-icons/fi";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import { useEffect } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([] as Post[]);
  const [nextPage, setNextPage] = useState<string>('');

  function ConfigurePosts(newPage) {
    const updatedPosts = [...posts];
     newPage.results.map((post => {
      const newDate = {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          // "'Hoje é' eeee",
          "dd' 'MMM' 'yyyy",
          {
            locale: ptBR,
          }
        )
      }
      updatedPosts.push(newDate);
    }))
    setPosts(updatedPosts);
    setNextPage(newPage.next_page);
  }

  useEffect(() => {
    ConfigurePosts(postsPagination);
  }, [postsPagination]);
  
  async function handleNextPage() {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => ConfigurePosts(data));
  }

  return (
    <>
      <Head>
        <title>Posts | desafio 3</title>
      </Head>

      <main>
        <div className={commonStyles.container}>
          <img src="/logo.svg" alt="logo" />

          <div className={styles.content}>
            {
              posts ?
                posts.map((post => {
                  return (
                    <Link key={post.uid} href={`/post/${post.uid}`}>
                      <a>
                        <strong>{post.data.title}</strong>
                        <p>{post.data.subtitle}</p>
                        <div>
                          <div>
                            <FiCalendar />
                            <p>{format(
                              new Date(post.first_publication_date),
                              // "'Hoje é' eeee",
                              "dd' 'MMM' 'yyyy",
                              {
                                locale: ptBR,
                              }
                            )}</p>
                          </div>
                          <div>
                            <FiUser />
                            <p>{post.data.author}</p>
                          </div>
                        </div>
                      </a>
                    </Link>
                  )
                }))
                : ''
            }
          </div>
          {
            nextPage ?
              <button className={styles.button} type="button" onClick={handleNextPage}>Carregar mais posts</button> : ''
          }
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.content'],
    pageSize: 1,
  })

  // console.log(JSON.stringify(response, null, 2))

  const posts = response.results.map(post => {    
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: response.next_page ?? null,
        results: posts
      }
    }
  }
};
