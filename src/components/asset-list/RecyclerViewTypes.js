/* eslint-disable sort-keys-fix/sort-keys-fix */
import { get } from 'lodash';
import React from 'react';
import {
  CoinDivider,
  CoinDividerHeight,
  SmallBalancesWrapper,
} from '../coin-divider';
import { CoinRowHeight } from '../coin-row';
import { SavingsCoinRowHeight } from '../coin-row/SavingsCoinRow';
import { FloatingActionButtonSize } from '../fab';
import { ListFooter } from '../list';
import PoolsListWrapper from '../pools/PoolsListWrapper';
import SavingsListWrapper from '../savings/SavingsListWrapper';
import { Header } from '../showcase/ShowcaseHeader';
import { TokenFamilyHeaderHeight } from '../token-family';
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader, { AssetListHeaderHeight } from './AssetListHeader';

export const firstCoinRowMarginTop = 6;
const lastCoinRowAdditionalHeight = 1;

const openSmallBalancesAdditionalHeight = 15;
const closedSmallBalancesAdditionalHeight = 18;

const savingsOpenAdditionalHeight = -7.5;
const savingsClosedAdditionalHeight = -5;
const savingsLastOpenAdditionalHeight = -13;
const savingsLastClosedAdditionalHeight = -10;

const poolsOpenAdditionalHeight = -12;
const poolsClosedAdditionalHeight = -15;
const poolsLastOpenAdditionalHeight = -14;
const poolsLastClosedAdditionalHeight = -10.5;

const firstUniqueTokenMarginTop = 4;
const extraSpaceForDropShadow = 19;

const amountOfImagesWithForcedPrioritizeLoading = 9;
const editModeAdditionalHeight = 100;

export const ViewTypes = {
  HEADER: {
    calculateHeight: ({ hideHeader = false }) =>
      hideHeader ? 0 : AssetListHeaderHeight,
    index: 0,
    renderComponent: ({ data, isCoinListEdited }) => {
      return <AssetListHeader {...data} isCoinListEdited={isCoinListEdited} />;
    },
    visibleDuringCoinEdit: true,
  },

  SHOWCASE_HEADER: {
    calculateHeight: () => 380,
    index: 8,
    renderComponent: data => {
      return <Header {...data} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_ROW: {
    calculateHeight: ({ isFirst, isLast, areSmallCollectibles }) =>
      CoinRowHeight +
      (isFirst ? firstCoinRowMarginTop : 0) +
      (!isFirst && isLast && !areSmallCollectibles
        ? ListFooter.height + lastCoinRowAdditionalHeight
        : 0),
    index: 1,
    renderComponent: ({ type, data }) => {
      const { item = {}, renderItem } = data;
      return renderItem({
        firstCoinRowMarginTop: firstCoinRowMarginTop,
        isFirstCoinRow: type.isFirst,
        item,
      });
    },
    visibleDuringCoinEdit: true,
  },

  COIN_DIVIDER: {
    calculateHeight: () => 0,
    index: 2,
    renderComponent: ({ data }) => {
      const { item = {} } = data;
      return <CoinDivider balancesSum={item.value} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_SMALL_BALANCES: {
    calculateHeight: ({ isOpen, smallBalancesLength, isCoinListEdited }) =>
      smallBalancesLength > 0
        ? isOpen
          ? smallBalancesLength * CoinRowHeight +
            openSmallBalancesAdditionalHeight +
            (isCoinListEdited ? editModeAdditionalHeight : 0)
          : closedSmallBalancesAdditionalHeight
        : 0,
    index: 3,
    renderComponent: ({ data }) => {
      const { item = {}, renderItem } = data;
      const renderList = [];
      for (let i = 0; i < item.assets.length; i++) {
        renderList.push(
          renderItem({
            item: {
              ...item.assets[i],
              isSmall: true,
            },
            key: `CoinSmallBalances${i}`,
          })
        );
      }
      // TODO: moize the renderList
      return <SmallBalancesWrapper assets={renderList} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_SAVINGS: {
    calculateHeight: () => 0,
    index: 4,
    renderComponent: ({ data }) => {
      const { item = {} } = data;
      return (
        <SavingsListWrapper assets={item.assets} totalValue={item.totalValue} />
      );
    },
    visibleDuringCoinEdit: false,
  },

  POOLS: {
    calculateHeight: () => 0,
    index: 5,
    renderComponent: ({ data, isCoinListEdited }) => {
      return <PoolsListWrapper {...data} isCoinListEdited={isCoinListEdited} />;
    },
    visibleDuringCoinEdit: false,
  },

  UNIQUE_TOKEN_ROW: {
    calculateHeight: () => 0,
    index: 6,
    renderComponent: ({ type, data, index, sections }) => {
      const { item = {}, renderItem } = data;
      return renderItem({
        childrenAmount: item.childrenAmount,
        familyId: item.familyId,
        familyImage: item.familyImage,
        familyName: item.familyName,
        isFirst: type.isFirst,
        isHeader: type.isHeader,
        item: item.tokens,
        shouldPrioritizeImageLoading:
          index <
          get(sections, '[0].data.length', 0) +
            amountOfImagesWithForcedPrioritizeLoading,
        uniqueId: item.uniqueId,
      });
    },
    visibleDuringCoinEdit: false,
  },

  FOOTER: {
    calculateHeight: () => 0,
    index: 7,
    visibleDuringCoinEdit: false,
  },
  UNKNOWN: {
    calculateHeight: () => 0,
    index: 99,
    visibleDuringCoinEdit: false,
  },
};
