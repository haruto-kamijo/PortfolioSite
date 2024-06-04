"use client"

import React from 'react'
import Link from 'next/link'
import {useState, useEffect} from 'react'
import { useMediaQuery } from 'react-responsive'



type HeaderProps = {
	title: string
}

const Header = ({ title }: HeaderProps) => {
	// visibleの値を変えることでメニューを表示・非表示させる
	const [visible, setVisible] = useState('visible')

	// 画面の大きさの判定ができる
	const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
	const isDesktopOrLaptop = useMediaQuery({ query: '(min-width: 1024px)'})
	const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })
	const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
	const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })

	// 右上のメニューをクリックで実行される
	const toggleHamburger = () => setVisible(visible === 'visible' ? 'hidden' : 'visible')

	// 画面のサイズが1024pxより大きくなるとisDesktopOrLaptopの値がtrueになる
	// isDesktopOrLaptopの値が変わる度にuseEffectは実行される
	useEffect(() => {
		if (!isDesktopOrLaptop) setVisible('hidden')
		else setVisible('visible')
	}, [isDesktopOrLaptop])
	return (
		<header className="w-full fixed z-50 h-16">
			<nav className="flex items-center justify-between flex-wrap bg-[#000000] p-4">
				<div className="flex items-center flex-shrink-0 text-white mr-6">
					<Link href="/">
						<img
							src="/logo.png"
							width={35}
							height={35}
							alt="logo" />
					</Link>
				</div>
				<div className="block lg:hidden">
					<button onClick={toggleHamburger}
									className="flex items-center px-2 py-2 border rounded bg-[#C2F8E711] text-[#C2F8E799] border-[#C2F8E799] hover:text-white hover:border-[#C2F8E7]">
						<svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
							<title>Menu</title>
							<path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/>
						</svg>
					</button>
				</div>
				<div className={`${visible} w-full block flex-grow lg:flex lg:items-center lg:w-auto`}>
					<div className="text-right lg:flex-grow">
						<Link href="/"
									className="block mt-4 lg:inline-block lg:mt-0 text-white text-center hover:text-teal-200 lg:ml-8 mx-6">
							Home
						</Link>
						<Link href="./About"
							 className="block mt-4 lg:inline-block lg:mt-0 text-white text-center hover:text-teal-200 mx-6">
							About
						</Link>
						<Link href="./Portfolio"
							 className="block mt-4 lg:inline-block lg:mt-0 text-white text-center hover:text-teal-200 mx-6">
							Portforlio
						</Link>
						<Link href="./Contact"
									className="block mt-4 lg:inline-block lg:mt-0 text-white text-center hover:text-teal-200 mx-6">
							Contact
					</Link>

					</div>
				</div>
			</nav>
		</header>
)
}

export default Header