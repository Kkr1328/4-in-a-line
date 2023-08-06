import { Coin, CoinTier, Visibility } from "./types";

import goldBitCoin from "../img/coin-skin/Gold_Bitcoin.png";
import goldCat from "../img/coin-skin/Gold_cat.png";
import goldDefault from "../img/coin-skin/Gold_Default.png";
import goldSmile from "../img/coin-skin/Gold_Smile.png";
import goldYinYang from "../img/coin-skin/Gold_Yin-yang.png";
import silverBitCoin from "../img/coin-skin/Silver_Bitcoin.png";
import silverCat from "../img/coin-skin/Silver_cat.png";
import silverDefault from "../img/coin-skin/Silver_Default.png";
import silverSmile from "../img/coin-skin/Silver_Smile.png";
import silverYinYang from "../img/coin-skin/Silver_Yin-yang.png";
import goldVibingCat from "../img/coin-skin/Gold-Vibing-Cat.gif";
import silverVibingCat from "../img/coin-skin/Silver-Vibing-Cat.gif";
import goldClover from "../img/coin-skin/Gold-Clover.gif";
import silverClover from "../img/coin-skin/Silver-Clover.gif";
import goldEarth from "../img/coin-skin/Gold-Earth.gif";
import silverEarth from "../img/coin-skin/Silver-Earth.gif";
import goldRainbowCrewmate from "../img/coin-skin/Gold-Rainbow-Crewmate.gif";
import silverRainbowCrewmate from "../img/coin-skin/Silver-Rainbow-Crewmate.gif";
import goldDogDance from "../img/coin-skin/Gold-dog-dance.gif";
import silverDogDance from "../img/coin-skin/Silver-dog-dance.gif";
import goldFrog from "../img/coin-skin/Gold-frog.gif";
import silverFrog from "../img/coin-skin/Silver-frog.gif";
import goldMad from "../img/coin-skin/Gold-mad.gif";
import silverMad from "../img/coin-skin/Silver-mad.gif";
import goldFire from "../img/coin-skin/Gold-fire.gif";
import silverFire from "../img/coin-skin/Silver-fire.gif";
import goldThanos from "../img/coin-skin/Gold-thanos.gif";
import silverThanos from "../img/coin-skin/Silver-thanos.gif";
import goldWiggle from "../img/coin-skin/Gold-wiggle.gif";
import silverWiggle from "../img/coin-skin/Silver-wiggle.gif";
import goldThisisfine from "../img/coin-skin/Gold-thisisfine.gif";
import silverThisisfine from "../img/coin-skin/Silver-thisisfine.gif";

const legendaryCoins: Coin[] = [
    // LEGENDARY 😎
    new Coin("Thanos", "Gold Thanos", goldThanos, CoinTier.LEGENDARY, Visibility.SHOW),
    new Coin("Thanos Hidden", "Silver Thanos", silverThanos, CoinTier.LEGENDARY, Visibility.HIDE),
    new Coin(
        "Vibing Cat Hidden",
        "Silver VibingCat",
        silverVibingCat,
        CoinTier.LEGENDARY,
        Visibility.HIDE
    ),
    new Coin("Vibing Cat", "Gold VibingCat", goldVibingCat, CoinTier.LEGENDARY, Visibility.SHOW),
    new Coin("Dancing Dog", "Gold DogDance", goldDogDance, CoinTier.LEGENDARY, Visibility.SHOW),
    new Coin(
        "Dancing Dog Hidden",
        "Silver DogDance",
        silverDogDance,
        CoinTier.LEGENDARY,
        Visibility.HIDE
    ),
    new Coin("Frog", "Gold Frog", goldFrog, CoinTier.LEGENDARY, Visibility.SHOW),
    new Coin("Frog Hidden", "Silver Frog", silverFrog, CoinTier.LEGENDARY, Visibility.HIDE),
    new Coin("This is fine", "Gold ThisIsFine", goldThisisfine, CoinTier.LEGENDARY, Visibility.SHOW),
    new Coin("This is fine Hidden", "Silver ThisIsFine", silverThisisfine, CoinTier.LEGENDARY, Visibility.HIDE),
];

const rareCoins: Coin[] = [
    // RARE 😲
    new Coin("Wiggle", "Gold Wiggle", goldWiggle, CoinTier.RARE, Visibility.SHOW),
    new Coin("Wiggle Hidden", "Silver Wiggle", silverWiggle, CoinTier.RARE, Visibility.HIDE),
    new Coin("Earth", "Gold Earth", goldEarth, CoinTier.RARE, Visibility.SHOW),
    new Coin("Earth Hidden", "Silver Earth", silverEarth, CoinTier.RARE, Visibility.HIDE),
    new Coin(
        "Crewmate",
        "Gold RainbowCrewmate",
        goldRainbowCrewmate,
        CoinTier.RARE,
        Visibility.SHOW
    ),
    new Coin(
        "Crewmate Hidden",
        "Silver RainbowCrewmate",
        silverRainbowCrewmate,
        CoinTier.RARE,
        Visibility.HIDE
    ),
];

const niceCoins: Coin[] = [
    // NICE 😀
    new Coin("Gold Clover", "Gold Clover", goldClover, CoinTier.NICE, Visibility.SHOW),
    new Coin("Silver Clover", "Silver Clover", silverClover, CoinTier.NICE, Visibility.SHOW),
    new Coin("Mad", "Gold Mad", goldMad, CoinTier.NICE, Visibility.SHOW),
    new Coin("Mad Hidden", "Silver Mad", silverMad, CoinTier.NICE, Visibility.HIDE),
    new Coin("Fire", "Gold Fire", goldFire, CoinTier.NICE, Visibility.SHOW),
    new Coin("Fire Hidden", "Silver Fire", silverFire, CoinTier.NICE, Visibility.HIDE),
];

const commonCoins: Coin[] = [
    // COMMON 🥱
    new Coin("Gold Bitcoin", "Gold Bitcoin", goldBitCoin, CoinTier.COMMON, Visibility.SHOW),
    new Coin("Gold Cat", "Gold Cat", goldCat, CoinTier.COMMON, Visibility.SHOW),
    new Coin("Gold Smile", "Gold Smile", goldSmile, CoinTier.COMMON, Visibility.SHOW),
    new Coin("Gold Yin Yang", "Gold YinYang", goldYinYang, CoinTier.COMMON, Visibility.SHOW),
    new Coin("Silver Bitcoin", "Silver Bitcoin", silverBitCoin, CoinTier.COMMON, Visibility.SHOW),
    new Coin("Silver Cat", "Silver Cat", silverCat, CoinTier.COMMON, Visibility.SHOW),
    new Coin("Silver Smile", "Silver Smile", silverSmile, CoinTier.COMMON, Visibility.SHOW),
    new Coin("Silver Yin Yang", "Silver YinYang", silverYinYang, CoinTier.COMMON, Visibility.SHOW),
];

const noobCoins: Coin[] = [
    // NOOB 🤮
    new Coin("Gold", "Gold Default", goldDefault, CoinTier.NOOB, Visibility.SHOW),
    new Coin("Silver", "Silver Default", silverDefault, CoinTier.NOOB, Visibility.SHOW),
];

export const allCoins: Coin[] = [
    // If we want to show only 1 version of the skin on the market page, make it 2 differently, and only show the "Gold" version
    // ! See Coin class before you add 😠
    ...legendaryCoins,
    ...rareCoins,
    ...niceCoins,
    ...commonCoins,
    ...noobCoins,
];
