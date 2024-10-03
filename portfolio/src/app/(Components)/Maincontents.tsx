import React from 'react'
import Link from 'next/link'

type MaincontentsProps = {
	count:number;
}

const Maincontents = ({ count}: MaincontentsProps) => {
	
	return (
		<div className="main-contents">
			<div className={count === 1 ? "contents-active" : "contents-nonactive"}>
				<p className="contents-title">My Web Site</p>
				<div className="absolute pc top-14 flex bg-sky-200">
					<div className="frame mt-6">
						<iframe className="absolute" width="1920" height="1080" src="https://digitalaquarium-1bea2.web.app/"/>
					</div>
					<div className="frame mt-6">
						<iframe className="absolute" width="1920" height="1080" src="https://harugassyukuhp-8c700.web.app/"/>
					</div>
				</div>
				<Link href="./Portfolio/Sites" className="contents-link">get more information</Link>
			</div>
			<div className={count === 2 ? "contents-active" : "contents-nonactive"}>
				<p className="contents-title">My Game</p>
				<p className="relative pt-32 text-center text-4xl">Coming soon....</p>
				<Link href="./Portfolio/Games" className="contents-link">get more information</Link>
			</div>
			<div className={count === 3 ? "contents-active" : "contents-nonactive"}>
				<p className="contents-title">My 3D Model</p>
				<p className="relative pt-32 text-center text-4xl">Coming soon....</p>
				<Link href="./Portfolio/Models" className="contents-link">get more information</Link>
			</div>
			<div className={count === 4 ? "contents-active" : "contents-nonactive"}>
				<p className="contents-title">My Photo</p>
				<p className="relative pt-32 text-center text-4xl">Coming soon....</p>
				<Link href="./Portfolio/Photos" className="contents-link">get more information</Link>
			</div>
			<div className={count === 5 ? "contents-active" : "contents-nonactive"}>
				<p className="contents-title">My Github</p>
				<div className="github-link"><Link href="https://github.com/haruto-kamijo" rel="noopener noreferrer" target="_blank">go to my github page</Link></div>
			</div>
		</div>
	)
}

export default Maincontents;