import IProvider from '../interfaces/provider'

/**
 * Providers
 */
export * as _4ocean from './4ocean'
export * as abercrombie from './abercrombie'
export * as adoreadorn from './adoreadorn'
export * as aloyoga from './aloyoga'
export * as altardstate from './altardstate'
export * as asics from './asics'
export * as angelacaglia from './angelacaglia'
export * as appearelOnepeloton from './apparelOnepeloton'
export * as arnette from './arnette'
export * as artizanjoyeria from './artizanjoyeria'
export * as bareminerals from './bareminerals'
export * as ballislife from './ballislife'
export * as barstoolsports from './barstoolsports'
export * as beautybakerie from './beautybakerie'
export * as blankwardrobe from './blankwardrobe'
export * as bodygroove from './bodygroove'
export * as bondisands from './bondisands'
export * as bossybeauty from './bossybeauty'
export * as bredawatch from './bredawatch'
export * as buffalovely from './buffalovely'
export * as byltbasics from './byltbasics'
export * as ceramicism_myshopify from './ceramicism_myshopify'
export * as charlottetilbury from './charlottetilbury'
export * as clarev from './clarev'
export * as clutchnails from './clutchnails'
export * as cremedelamer from './cremedelamer'
export * as crete from './crete'
export * as cynthiarowley from './cynthiarowley'
export * as deathwishcoffee from './deathwishcoffee'
export * as diarrablu from './diarrablu'
export * as dolcevita from './dolcevita'
export * as dragunbeauty from './dragunbeauty'
export * as edikanmoses from './edikanmoses'
export * as edikanshop from './edikanshop'
export * as ellenshop from './ellenshop'
export * as ellievailjewelry from './ellievailjewelry'
export * as estellecoloredglass from './estellecoloredglass'
export * as evolutionofsmooth from './evolutionofsmooth'
export * as fahertybrand from './fahertybrand'
export * as fanjoy from './fanjoy'
export * as fetehome from './fetehome'
export * as flowerbeauty from './flowerbeauty'
export * as flybyjing from './flybyjing'
export * as freckbeauty from './freckbeauty'
export * as furyou from './furyou'
export * as gadecosmetics from './gadecosmetics'
export * as grammarnyc from './grammarnyc'
export * as guyfieristore from './guyfieristore'
export * as hauslabs from './hauslabs'
export * as hedleyandbennett from './hedleyandbennett'
export * as herocosmetics from './herocosmetics'
export * as hillhousehome from './hillhousehome'
export * as hm from './hm'
export * as hollisterco from './hollisterco'
export * as hologearco from './hologearco'
export * as ilysm from './ilysm'
export * as indielee from './indielee'
export * as inhhair from './inhhair'
export * as jadensmith from './jadensmith'
export * as jane from './jane'
export * as jockey from './jockey'
export * as juicebeauty from './juicebeauty'
export * as keenfootwear from './keenfootwear'
export * as langehair from './langehair'
export * as letterfolk from './letterfolk'
export * as liveabove from './liveabove'
export * as loefflerrandall from './loefflerrandall'
export * as lovesweatfitness from './lovesweatfitness'
export * as lovingwv from './lovingwv'
export * as makeupbymario from './makeupbymario'
export * as mdesignhomedecor from './mdesignhomedecor'
export * as meetlalo from './meetlalo'
export * as mentedcosmetics from './mentedcosmetics'
export * as migolondrina from './migolondrina'
export * as moonlitskincare from './moonlitskincare'
export * as mountlai from './mountlai'
export * as mykitsch from './mykitsch'
export * as navyhaircare from './navyhaircare'
export * as nike from './nike'
export * as oliversapparel from './oliversapparel'
export * as orseundiris from './orseundiris'
export * as oseamalibu from './oseamalibu'
export * as outdoorvoices from './outdoorvoices'
export * as apparelOnepeloton from './apparelOnepeloton'
export * as patmcgrath from './patmcgrath'
export * as period from './period'
export * as pleasuresnow from './pleasuresnow'
export * as priverevaux from './priverevaux'
export * as promptlyjournals from './promptlyjournals'
export * as rarebeauty from './rarebeauty'
export * as rastaclat from './rastaclat'
//export * as revolve from './revolve'
export * as richerpoorer from './richerpoorer'
export * as rheacherie from './rheacherie'
export * as ruffledthread from './ruffledthread'
export * as sainthoax from './sainthoax'
export * as sebastiancruzcouture from './sebastiancruzcouture'
export * as selenagomez from './selenagomez'
export * as sensefordecor from './sensefordecor'
export * as shitheadsteve from './shitheadsteve'
export * as shopify from './shopify'
export * as shopkm from './shopkm'
export * as shopkmj from './shopkmj'
export * as shopimpressions from './shopimpressions'
export * as shoprumours from './shoprumours'
export * as slamgoods from './slamgoods'
export * as soldejaneiro from './soldejaneiro'
export * as soonskincare from './soonskincare'
export * as sparkleinpink from './sparkleinpink'
export * as staycoolnyc from './staycoolnyc'
export * as theentireworld from './theentireworld'
export * as thehydrojug from './thehydrojug'
export * as tphbytaraji from './tphbytaraji'
export * as uninterrupted from './uninterrupted'
export * as upness from './upness'
export * as urbanskinrx from './urbanskinrx'
export * as velvetTees from './velvet-tees'
// export * as victoriabeckhambeauty from './victoriabeckhambeauty'
export * as vulcanarms from './vulcanarms'
export * as warbyparker from './warbyparker'
export * as wearstems from './wearstems'
export * as westmanatelier from './westman-atelier'
export * as wildling from './wildling'
export * as youthtothepeople from './youthtothepeople'
export * as zox from './zox'
export * as cosbar from './cosbar'
export * as spartina449 from './spartina449'
export * as tods from './tods'
export * as thetinytassel from './thetinytassel'
export * as smashbox from './smashbox'
export * as kiplingusa from './kiplingusa'

export function getProvider(name: string) {
  const provider: IProvider = exports[name]
  if (!provider) {
    throw new Error(`Provider "${name}" not found`)
  }
  return provider
}
