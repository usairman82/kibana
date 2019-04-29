/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiBadge, EuiToolTip } from '@elastic/eui';
import { FormattedRelative } from '@kbn/i18n/react';
import { has } from 'lodash/fp';
import React from 'react';
import { connect } from 'react-redux';
import { pure } from 'recompose';
import { ActionCreator } from 'typescript-fsa';

import { AuthenticationsEdges } from '../../../../graphql/types';
import { hostsActions, hostsModel, hostsSelectors, State } from '../../../../store';
import { DragEffects, DraggableWrapper } from '../../../drag_and_drop/draggable_wrapper';
import { escapeDataProviderId } from '../../../drag_and_drop/helpers';
import { getEmptyTagValue } from '../../../empty_value';
import { HostDetailsLink, IPDetailsLink } from '../../../links';
import { Columns, ItemsPerRow, LoadMoreTable } from '../../../load_more_table';
import { Provider } from '../../../timeline/data_providers/provider';

import * as i18n from './translations';
import { getRowItemDraggables } from '../../../tables/helpers';

interface OwnProps {
  data: AuthenticationsEdges[];
  loading: boolean;
  hasNextPage: boolean;
  nextCursor: string;
  totalCount: number;
  loadMore: (cursor: string) => void;
  type: hostsModel.HostsType;
}

interface AuthenticationTableReduxProps {
  limit: number;
}

interface AuthenticationTableDispatchProps {
  updateLimitPagination: ActionCreator<{ limit: number; hostsType: hostsModel.HostsType }>;
}

type AuthenticationTableProps = OwnProps &
  AuthenticationTableReduxProps &
  AuthenticationTableDispatchProps;

const rowItems: ItemsPerRow[] = [
  {
    text: i18n.ROWS_5,
    numberOfRow: 5,
  },
  {
    text: i18n.ROWS_10,
    numberOfRow: 10,
  },
  {
    text: i18n.ROWS_20,
    numberOfRow: 20,
  },
  {
    text: i18n.ROWS_50,
    numberOfRow: 50,
  },
];

const AuthenticationTableComponent = pure<AuthenticationTableProps>(
  ({
    data,
    hasNextPage,
    limit,
    loading,
    loadMore,
    totalCount,
    nextCursor,
    updateLimitPagination,
    type,
  }) => (
    <LoadMoreTable
      columns={getAuthenticationColumns()}
      loadingTitle={i18n.AUTHENTICATIONS}
      loading={loading}
      pageOfItems={data}
      loadMore={() => loadMore(nextCursor)}
      limit={limit}
      hasNextPage={hasNextPage}
      itemsPerRow={rowItems}
      updateLimitPagination={newLimit =>
        updateLimitPagination({ limit: newLimit, hostsType: type })
      }
      title={
        <h3>
          {i18n.AUTHENTICATIONS} <EuiBadge color="hollow">{totalCount}</EuiBadge>
        </h3>
      }
    />
  )
);

const makeMapStateToProps = () => {
  const getAuthenticationsSelector = hostsSelectors.authenticationsSelector();
  return (state: State, { type }: OwnProps) => {
    return getAuthenticationsSelector(state, type);
  };
};

export const AuthenticationTable = connect(
  makeMapStateToProps,
  {
    updateLimitPagination: hostsActions.updateAuthenticationsLimit,
  }
)(AuthenticationTableComponent);

const getAuthenticationColumns = (): [
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>,
  Columns<AuthenticationsEdges>
] => [
  {
    name: i18n.USER,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) =>
      getRowItemDraggables({
        rowItems: node.user.name,
        attrName: 'user.name',
        idPrefix: `authentications-table-${node._id}-userName`,
      }),
  },
  {
    name: i18n.FAILURES,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) => {
      const id = escapeDataProviderId(
        `authentications-table-${node._id}-failures-${node.failures}`
      );
      return (
        <DraggableWrapper
          key={id}
          dataProvider={{
            and: [],
            enabled: true,
            id,
            name: 'authentication_failure',
            excluded: false,
            kqlQuery: '',
            queryMatch: {
              field: 'event.type',
              value: 'authentication_failure',
            },
          }}
          render={(dataProvider, _, snapshot) =>
            snapshot.isDragging ? (
              <DragEffects>
                <Provider dataProvider={dataProvider} />
              </DragEffects>
            ) : (
              node.failures
            )
          }
        />
      );
    },
  },
  {
    name: i18n.LAST_FAILED_TIME,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) =>
      has('lastFailure.timestamp', node) && node.lastFailure!.timestamp != null ? (
        <EuiToolTip position="bottom" content={node.lastFailure!.timestamp!}>
          <FormattedRelative value={new Date(node.lastFailure!.timestamp!)} />
        </EuiToolTip>
      ) : (
        getEmptyTagValue()
      ),
  },
  {
    name: i18n.LAST_FAILED_SOURCE,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) =>
      getRowItemDraggables({
        rowItems:
          node.lastFailure != null &&
          node.lastFailure.source != null &&
          node.lastFailure.source.ip != null
            ? node.lastFailure.source.ip
            : null,
        attrName: 'source.ip',
        idPrefix: `authentications-table-${node._id}-lastFailureSource`,
        render: item => <IPDetailsLink ip={item} />,
      }),
  },
  {
    name: i18n.LAST_FAILED_DESTINATION,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) =>
      getRowItemDraggables({
        rowItems:
          node.lastFailure != null &&
          node.lastFailure.host != null &&
          node.lastFailure.host.name != null
            ? node.lastFailure.host.name
            : null,
        attrName: 'host.name',
        idPrefix: `authentications-table-${node._id}-lastFailureDestination`,
        render: item => <HostDetailsLink hostName={item} />,
      }),
  },
  {
    name: i18n.SUCCESSES,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) => {
      const id = escapeDataProviderId(
        `authentications-table-${node._id}-node-successes-${node.successes}`
      );
      return (
        <DraggableWrapper
          key={id}
          dataProvider={{
            and: [],
            enabled: true,
            id,
            name: 'authentication_success',
            excluded: false,
            kqlQuery: '',
            queryMatch: {
              field: 'event.type',
              value: 'authentication_success',
            },
          }}
          render={(dataProvider, _, snapshot) =>
            snapshot.isDragging ? (
              <DragEffects>
                <Provider dataProvider={dataProvider} />
              </DragEffects>
            ) : (
              node.successes
            )
          }
        />
      );
    },
  },
  {
    name: i18n.LAST_SUCCESSFUL_TIME,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) =>
      has('lastSuccess.timestamp', node) ? (
        <EuiToolTip position="bottom" content={node.lastSuccess!.timestamp!}>
          <FormattedRelative value={new Date(node.lastSuccess!.timestamp!)} />
        </EuiToolTip>
      ) : (
        getEmptyTagValue()
      ),
  },
  {
    name: i18n.LAST_SUCCESSFUL_SOURCE,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) =>
      getRowItemDraggables({
        rowItems:
          node.lastSuccess != null &&
          node.lastSuccess.source != null &&
          node.lastSuccess.source.ip != null
            ? node.lastSuccess.source.ip
            : null,
        attrName: 'source.ip',
        idPrefix: `authentications-table-${node._id}-lastSuccessSource`,
        render: item => <IPDetailsLink ip={item} />,
      }),
  },
  {
    name: i18n.LAST_SUCCESSFUL_DESTINATION,
    truncateText: false,
    hideForMobile: false,
    render: ({ node }) =>
      getRowItemDraggables({
        rowItems:
          node.lastSuccess != null &&
          node.lastSuccess.host != null &&
          node.lastSuccess.host.name != null
            ? node.lastSuccess.host.name
            : null,
        attrName: 'host.name',
        idPrefix: `authentications-table-${node._id}-lastSuccessfulDestination`,
        render: item => <HostDetailsLink hostName={item} />,
      }),
  },
];
