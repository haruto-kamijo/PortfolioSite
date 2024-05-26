import React from 'react'

type FVProps = {
	catchphrase: string
	buttonText: string
}

const FV = ({catchphrase, buttonText }: FVProps) => {
	return (
		<section className="flex-none w-screen h-80">
			<h2>{catchphrase}</h2>
			<button>{buttonText}</button>
		</section>
	)
}

export default FV