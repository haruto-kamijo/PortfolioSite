import React from 'react'

type FVProps = {
	catchphrase: string
	buttonText: string
}

const FV = ({catchphrase, buttonText }: FVProps) => {
	return (
		<section className="flex-none w-screen h-5/6">
			<h2 className="">{catchphrase}</h2>
			<button className="">{buttonText}</button>
		</section>
	)
}

export default FV