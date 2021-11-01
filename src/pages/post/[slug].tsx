import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Header from '../../components/Header';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from "date-fns"
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
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

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    { locale: ptBR }
  )

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);
  
  return(
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <Header />
      
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="Banner postagem" />
        <article className={`${styles.post} ${commonStyles.container}`}>
          <h1>{post.data.title}</h1>
          <section>
            <div>
              <FiCalendar size={'1.25rem'} className={styles.icon} />
              <time>{formatedDate}</time>
            </div>
            <div>
              <FiUser size={'1.25rem'} className={styles.icon} />
              <p>{post.data.author}</p>
            </div>
            <div>
              <FiClock size={'1.25rem'} className={styles.icon} />
              <p>{readingTime} min</p>
            </div>
          </section>
          {post.data.content.map((item, index) => (
            <div key={item.heading}>
              <h2>{item.heading}</h2>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={
                  { __html: RichText.asHtml(item.body) }
                }
              />
            </div>
          ))}
        </article>
      </main>

    </>
  )
  
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ]);
  
  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    data: {
      title: response.data.title,
      author: response.data.author,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content.map(item => {
        return {
          heading: item.heading,
          body: [...item.body],
        }
      }),
    },
    first_publication_date: response.first_publication_date
  }

  return {
      props: {
          post
      },
      revalidate: 60 * 30,
  }
};
