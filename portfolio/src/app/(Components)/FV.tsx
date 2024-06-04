import React from 'react'


// type FVProps = {
// 	developername:string
// 	catchphrase: string
// 	buttonText: string
// }

const FV = () => {

	return (
		<section className="flex-none w-screen h-screen ">
			{/*<div className="absolute z-0 mt-0 flex flex-wrap catchcopy-container">*/}
			{/*	<p className=" catchcopy">Find</p>*/}
			{/*	<p className="catchcopy">your</p>*/}
			{/*	<p className="catchcopy">own</p>*/}
			{/*	<p className="catchcopy">color</p>*/}
			{/*</div>*/}
			<div className="profile relative">
				<h1 className="text-3xl z-10 lg:text-7xl bg-emerald-400 w-max">Haruto Kamijo</h1>
				{/*<h1 className="text-3xl z-10 lg:text-7xl"></h1>*/}
				<div className="relative text-3xl z-10 lg:text-5xl mt-16"><p className="bg-blue-500 w-max">Skills</p>
					<h2 className="text-3xl z-10 lg:text-5xl mt-0 ">
						<p className="mt-2 w-max bg-purple-400">Game:<span className="text-white hover:text-orange-300">Java/Android Studio,</span><span className="text-white hover:text-orange-300">C#/Unity</span></p>
						<p className="mt-2 w-max bg-purple-400">Web:<span className="text-white hover:text-orange-300">HTML/CSS/JS,</span><span className="text-white hover:text-orange-300">TS/Next.js/Tailwind</span></p>
						<p className="mt-2 w-max bg-purple-400">AI:<span className="text-white hover:text-orange-300">Python/PyTorch,</span><span className="text-white hover:text-orange-300">Python/TensorFlow/Keras</span></p>
						<p className="mt-2 w-max bg-purple-400">Other:<span className="text-white hover:text-orange-300">3D Model/Blender,</span><span className="text-white hover:text-orange-300">Design/Illustrator/Photoshop</span></p>

					</h2>
					{/*<h2 className="text-3xl z-10 lg:text-5xl"></h2>*/}
				</div>
			</div>

		</section>
	)
}

export default FV