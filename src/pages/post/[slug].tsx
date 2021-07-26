import { GetStaticPaths, GetStaticProps } from 'next';
import { FiUser, FiCalendar, FiClock } from "react-icons/fi";

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header/index'
import Head from 'next/head';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { Fragment, useEffect, useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { UtterancesComments } from '../../components/UtterancesComments/index';
import Link from 'next/link';

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface Pages {
  uid: string;
  title: string;
}

interface PostProps {
  post: Post;
  pages: Pages[];
}

interface LinksPageProps {
  lastPage: Pages[],
  nextPage: Pages[]
}

export default function Post({ post, pages }: PostProps) {
  const router = useRouter();
  const [postConverted, setPostConverted] = useState({} as Post);
  const [linksPage, setLinksPage] = useState({} as LinksPageProps)

  useEffect(() => {
    const productIndex = pages.findIndex(page => page.uid === post.uid);
    if (productIndex < 0) return;

    const newLinksPage = {
      lastPage: productIndex > 0 ? pages.splice(productIndex - 1, 1) : null,
      nextPage: productIndex + 1 > pages.length ? null : pages.splice(productIndex + 1, 1),
    }
    setLinksPage(newLinksPage)
  }, [pages]);
  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Carregando... | IgNews</title>
        </Head>

        <Header />
        <div>Carregando...</div>
      </>
    )

  }

  function SetPost(post: Post) {
    const newPostConverted = {
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
    setPostConverted(newPostConverted);
  }

  useEffect(() => {
    SetPost(post);
  }, [post]);

  function setTimeReadSome() {
    const time = post.data.content.reduce((acc, content) => {
      const letterForm = /[^A-z]/g;
      const heading = content.heading;
      const headingForm = heading.split(letterForm);
      const valueHeading = headingForm.length;


      const body = RichText.asText(content.body);
      const bodyForm = body.split(letterForm);
      const valueBody = bodyForm.length;

      acc += valueHeading + valueBody;
      return acc;
    }, 0)
    const timeRead = (time / 200)

    return Math.round(timeRead);
  }


  return (
    <>
      <Head>
        <title>{postConverted.data?.title} | IgNews</title>
      </Head>

      <Header />
      <main className={styles.container}>
        <img src={postConverted.data?.banner.url} alt="banner" />
        <div className={commonStyles.container}>
          <strong>{postConverted.data?.title}</strong>

          <div className={styles.info}>
            <div>
              <FiCalendar />
              <p>{postConverted.first_publication_date}</p>
            </div>
            <div>
              <FiUser />
              <p>{post.data.author}</p>
            </div>
            <div>
              <FiClock />
              <p>{setTimeReadSome()} min</p>
            </div>
          </div>
          <section className={styles.content}>
            {
              postConverted ?
                postConverted.data?.content.map(content => {
                  return (
                    <Fragment key={content.heading}>
                      <strong>
                        {content.heading}
                      </strong>
                      <div
                        dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} />
                    </Fragment>
                  )
                })
                : ''
            }
          </section>
        </div>
      </main>
      <div className={`${styles.footer} ${commonStyles.container}`}>
        <div className={styles.pages}>
          {
            linksPage.lastPage ?
              <div className={`${styles.content} ${commonStyles.right}`}>
                <p>{linksPage.lastPage[0]?.title}</p>
                <Link href={`/post/${linksPage.lastPage[0]?.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
              :
              ''
          }
          {
            linksPage.nextPage ?
              <div className={`${styles.content} ${styles.left}`}>
                <p>{linksPage.nextPage[0]?.title}</p>
                <Link href={`/post/${linksPage.nextPage[0]?.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
              :
              ''
          }
        </div>
        <UtterancesComments />
      </div>

    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const newPaths = [];
  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: [],
    pageSize: 1000,
  })

  response.results.map((response) => {
    newPaths.push({ params: { slug: response.uid } });
    //response.uid
  })

  return {
    paths: newPaths,
    fallback: true // true, false (error page 404), blocking
  }
}



export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient()

  const response = await prismic.getByUID('posts', String(slug), {});

  const setPages = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: [],
    pageSize: 100,
  })

  const setPagesFormated: Pages[] = setPages.results.map(r => {
    return (
      {
        uid: r.uid,
        title: r.data.title,
      }
    )
  })


  //console.log(JSON.stringify(response, null, 2))

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(container => {
        return {
          heading: container.heading,
          body: container.body,
        }
      })
    }
  }

  return ({
    props: {
      post,
      pages: setPagesFormated
    },
    redirect: 60 * 30, //30 minutos
  })
}
