import { useEffect, useState } from 'react'
import Image from 'next/image'
import Router from 'next/router'

import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

import { Button } from './Button'

import useAuth from '../hooks/useAuth'
import formatCreatedAt from '../utils/formatCreatedAt'

// import notcomments from '../assets/image/notcomments.svg'

import { RiDeleteBin2Line } from 'react-icons/ri'

import styles from '../styles/components/post.module.scss'
import { db } from '../lib/firebase'


export default function Post({idPost, createdAt,postContent}) {
    const [ comment, setComment ] = useState('')
    const [ comments, setComments ] = useState([])

    const {user} = useAuth()

    useEffect(() => {
        console.log(idPost)
        Prism.highlightAll()
    }, [idPost])

    useEffect(() => {
        const ref = db.ref(`comments/${idPost}`)

        ref.on('value', (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const arrData = Object.entries(data).map(([key, comment]) => {
                    return {
                        idComment: key,
                        comment
                    }
                })
                setComments(arrData)    
            } else {
                setComments('')
                return
            }
        })
    }, [idPost])        

 
    async function handleNewComment(e, id) {
        e.preventDefault()
        if (comment.trim() && user) {
            if ( id ) {
                const parsedCommet = {
                    content: comment,
                    author: user,
                    idPost: idPost
                }
            } else {
                const dataCreatedcomment = new Date()

                const parsedCommet = {
                    content: comment,
                    author: user,
                    createdAt: Date.parse(dataCreatedcomment)
                }
                
                await db.ref(`comments/${idPost}`).push(parsedCommet)
            }
            setComment('')
        }

    }


    async function handleDeleteComment(idComment) {
        await db.ref(`comments/${idPost}/${idComment}`).remove()
    }


    return (
        <>
        <section className={styles.post}>
            <div className={styles.postContent}>
                <header className={styles.header__title}>
                    <h1 className={styles.title}>
                        {postContent.filter( item => item._modelApiKey === 'title').map(item => item.titulo)}
                    </h1>
                    <h3 className={styles.subtitle}>
                        {postContent.filter( item => item._modelApiKey === 'subtitle').map(item => item.subtitulo)}
                    </h3>
                    <h5 className={styles.autor}>Por {postContent.filter( item => item._modelApiKey === 'author').map(item => item.nome)}</h5>
                    <div className={styles.header__bottom}>
                        {
                            createdAt &&  <p className={styles.date}>{formatCreatedAt(Date.parse(createdAt))}</p>
                        }
                    </div>
                </header>
                
                <div className={styles.main__content}>
                    {
                        postContent.map( item => {
                            if (item._modelApiKey === 'content') {
                                return <div key={item.id} className={styles.content} dangerouslySetInnerHTML={{__html: item.conteudo}}></div>
                            }

                            if (item._modelApiKey === 'code') {
                                return (                                   
                                    
                                    <pre key={item.id} style={{borderRadius: '5px'}}>
                                        <code className={`language-${item.language}`} >
                                            {item.content}
                                        </code>
                                    </pre>
                                )
                            }

                            if (item._modelApiKey === 'image') {
                                if(item.video) {
                                    return (
                                        <iframe
                                            key={item.id}
                                            // width="700"
                                            height="300" 
                                            src={`https://www.youtube.com/embed/${item.video?.providerUid}`}
                                            title="YouTube video player" 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen>
                                        </iframe>
                                    )
                                }
                            }

                            if (item._modelApiKey === 'image') {
                                if(item.imagem[0]) {
                                    return (
                                        <img
                                            alt={item.alt}
                                            key={item.id}
                                            className={styles.img}
                                            src={item.imagem[0].url}
                                            title={item.alt}
                                        />
                                    )
                                }
                            }
                        })
                    }
                </div>
            </div>
            <div className={styles.interaction_post}>
                <div className={styles.comments_box}>
                    <header>
                        <h1>Cometários</h1>
                    </header>
                    <div  className={styles.footer}>
                        <ul className={styles.comments}>
                            {
                                !comments.length ? (
                                    <>
                                        <Image  
                                            src="/notcomments.svg"
                                            alt="Ainda não há comentátarios"
                                            width={300}
                                            height={150}
                                        />
                                        <h3 className={styles.notcomments}>Ainda não há comentários</h3>
                                    </>
                                    )
                                    : 
                                    (
                                        comments.map( ({idComment, comment}) => (
                                            <li className={styles.comment} key={idComment}>
                                                <span className={styles.author_name}>
                                                    <span>
                                                        {comment.author.name}
                                                    </span>
                                                    {
                                                        user?.uid === comment.author.uid && (
                                                        <button onClick={() => handleDeleteComment(idComment)}>
                                                            <RiDeleteBin2Line
                                                            size='20px'
                                                            color='red'
                                                             />
                                                        </button>)
                                                    }
                                                </span>
                                                <span className={styles.content}>{comment.content}</span>
                                                <span className={styles.createdAt}>{formatCreatedAt(comment.createdAt)}</span>
                                            </li>
                                        ))
                                    )
                            }
                        </ul>
                        <form onSubmit={handleNewComment}>
                            <textarea
                            onChange={({target}) => {
                                if (comment.length < 200) {
                                    setComment(target.value)
                                }
                            }}

                            onInput={(e) => {
                                if ( e.nativeEvent.inputType === "deleteContentBackward" && comment.length >= 200 ) {
                                    setComment(comment.slice(0 , -1))
                                }
                            }}
                            value={comment}
                            placeholder="Deixe seu comentário!"
                            />
                            <p>200/{comment.length}</p>
                            {
                                user ? (
                                    <Button disabled={!comment.length} type="submit" isInverse>Enviar</Button>
                                ) : <Button isInverse onClick={() => Router.push('/login')}>Login</Button>
                            }
                        </form>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}

