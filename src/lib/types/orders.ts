export interface UnifiedOrder {
	id: string;
	reference: string;
	fxOrderType: 'forward' | 'chain' | 'spot';
	marketDirection: 'buy' | 'sell';
	buyAmountCents: number;
	sellAmountCents: number;
	buyCurrency: string;
	sellCurrency: string;
	rate: number;
	valueDate: string;
	creationDate: string;
	executionDate: string | null;
	status: 'open' | 'closed_to_trading' | 'completed';
	liquidityProvider: string;
}

export interface Swap {
	id: string;
	parentChainId: string;
	swapType: 'roll' | 'early-draw';
	status: string;
	nearValueDate: string;
	farValueDate: string;
	notionalMarketDirection: string;
	amountCents: number;
	currency: string;
	counterCurrency: string;
	nearDirection: string;
	farDirection: string;
	buyAmountCents: number;
	sellAmountCents: number;
	buyCurrency: string;
	sellCurrency: string;
	rate: number;
	spotRate: number;
	swapPoints: number;
	swapPointsCurrency: string;
	chainRate: number;
	executedDate: string | null;
	created: string;
}

export interface Leg {
	id: string;
	swapId: string;
	legType: 'near' | 'far';
	sellAmountCents: number;
	sellCurrency: string;
	buyAmountCents: number;
	buyCurrency: string;
	rate: number;
	valueDate: string;
	status: string;
}
