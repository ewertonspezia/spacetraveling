import { GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from "date-fns"
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../components/Header';

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
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [otherPost, setOtherPost] = useState([] as Post[]);

  function loadPosts() {
    var myHeaders = new Headers();

    const myInit = {
      method: 'GET',
      headers: myHeaders,
    };

    if (nextPage) {
      fetch(nextPage, myInit)
        .then(response => response.json())
        .then(data => {

          const posts = data.results.map(post => {
            return {
              uid: post.uid,
              first_publication_date: format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                { locale: ptBR }
              ),
              data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author:post.data.author,
              },
            }
          });

          setOtherPost([...otherPost, ...posts]);
          setNextPage(data.next_page);
        });
    }
  }
  
  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <div className={styles.posts}>
            {postsPagination.results.map(post => {
              const formatedDate = format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                { locale: ptBR }
              )
            return( 
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <section>
                    <div>
                      <FiCalendar size={'1.25rem'} className={styles.icon} />
                      <time>{formatedDate}</time>
                    </div> 
                    <div> 
                      <FiUser size={'1.25rem'} className={styles.icon} />
                      <span>{post.data.author}</span>
                    </div> 
                  </section>
                </a>
              </Link>
            ) 
          })}

          {
            otherPost.length > 0 ? (
              otherPost.map(post => (
                <Link href={`/post/${post.uid}`} key={post.uid}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <section>
                      <div>
                        <FiCalendar size={'1.25rem'} className={styles.icon} />
                        <time>{post.first_publication_date}</time>
                      </div>
                      <div>
                        <FiUser size={'1.25rem'} className={styles.icon} />
                        <span>{post.data.author}</span>
                      </div>
                    </section>
                  </a>
                </Link>
              ))
            ) : <></>
          }

          {
            nextPage ? (
              <button
                onClick={loadPosts}
              >Carregar mais posts</button>
            ) : <></>
          }
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['post.title', 'post.content'],
    pageSize: 1
  });

  const posts = postsResponse.results.map(post => {
    return {
        uid: post.uid,
        data: {
          title: post.data.title,
          author: post.data.author,
          subtitle: post.data.subtitle,
        },
        first_publication_date: post.first_publication_date
      }  
    })

    return {
      props: {
        postsPagination: {
          next_page: postsResponse.next_page,
          results: posts
        }
    },
    revalidate: 60 * 60
  }
};
