"""Aggregate Data
Usage:
main <start-date> <end-date>
main 2017-06-11 2017-08-11"""

import os
import pandas as pd
import logging as log
from docopt import docopt
from datetime import datetime

from grab_data import helpers

COLS_GENERAL_METRICS = ['payload.pull_request.changed_files', 'payload.pull_request.commits',
                        'payload.pull_request.merged', 'payload.pull_request.comments',
                        'payload.pull_request.number', 'payload.pull_request.base.repo.open_issues_count',
                        'days_open_merged', 'creator_merge']
LANGUE_COL = ['payload.pull_request.base.repo.language', 'cohort']


def create_new_cols(df):
    """
    Create new usefull columns
    :param df: dataframe
    :return: dataframe plus new columns
    """
    df['days_open_merged'] = ((pd.to_datetime(df['payload.pull_request.merged_at'])
                               - pd.to_datetime(df['payload.pull_request.created_at']))
                              .apply(lambda x: x.days))
    df['creator_merge'] = df['payload.pull_request.merged_by.login'] == df['actor.display_login']
    df['cohort'] = pd.to_datetime(df['created_at']).apply(lambda x: x.strftime('%Y-%m'))

    return df


def aggregate_stats_metrics(df):
    """
    Aggregate statistics of usefull columns
    :param df: dataframe
    :return: dataframe with aggregated informations
    """
    agg_by_language = pd.DataFrame(df[COLS_GENERAL_METRICS + LANGUE_COL]
                                   .groupby(LANGUE_COL)
                                   .describe()
                                   .unstack(1)
                                   .unstack(1)
                                   .reset_index()
                                   .rename(columns={'level_0': 'column',
                                                    'level_1': 'metric',
                                                    'payload.pull_request.base.repo.language': 'language',
                                                    0: 'value'}))
    agg_all_languages = pd.DataFrame(df[COLS_GENERAL_METRICS + ['cohort']]
                                     .groupby(['cohort'])
                                     .describe(percentiles=[0, 0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99, 1])
                                     .unstack(1)
                                     .reset_index()
                                     .rename(columns={'level_0': 'column',
                                                      'level_1': 'metric',
                                                      0: 'value'}))
    agg_all_languages['language'] = 'all'

    agg_by_language = pd.concat([agg_all_languages, agg_by_language])

    return agg_by_language


def aggregate_general_metrics(df):
    """
    Aggregate data by usefull metrics
    :param df: dataframe
    :return: dataframe with aggregated informations
    """
    count_prs = pd.DataFrame(df
                             .groupby(LANGUE_COL)
                             .size()
                             .reset_index()
                             .rename(columns={'payload.pull_request.base.repo.language': 'language',
                                              0: 'number_prs'}))

    count_actor = pd.DataFrame(df
                               .groupby(LANGUE_COL)
                               .nunique()['actor.display_login']
                               .reset_index()
                               .rename(columns={'payload.pull_request.base.repo.language': 'language',
                                                0: 'number_distinct_actors'}))

    mean_prs = count_prs.groupby('cohort').mean().reset_index()
    mean_prs['language'] = 'all'
    count_prs = pd.concat([mean_prs, count_prs], axis=0)

    mean_actors = count_actor.groupby('cohort').mean().reset_index()
    mean_actors['language'] = 'all'
    count_actor = pd.concat([mean_actors, count_actor], axis=0)

    return count_prs.merge(count_actor, on=['language', 'cohort'], how='inner')


if __name__ == '__main__':
    log.getLogger().setLevel(log.INFO)

    arguments = docopt(__doc__)
    start_date = arguments['<start-date>']
    end_date = arguments['<end-date>']

    helpers.are_dates_valid(start_date, end_date)

    df = helpers.get_data(helpers.DATA_FOLDER, start_date, end_date)
    df = create_new_cols(df)

    # General statistics by language and cohort
    agg_by_stats = aggregate_stats_metrics(df)
    file_stats_data = os.path.join(helpers.DATA_FOLDER, 'agg_stats_{s}_{e}__processedat_{n}.csv'
                                   .format(s=start_date, e=end_date, n=datetime.now().strftime('%Y-%m-%d')))
    agg_by_stats.to_csv(file_stats_data, index=False)
    log.info('Statistics of aggregated data was saved in {f}'.format(f=file_stats_data))

    # Count of PRs and unique actors by language and cohort
    agg_by_general = aggregate_general_metrics(df)
    file_general_data = os.path.join(helpers.DATA_FOLDER, 'agg_general_{s}_{e}__processedat_{n}.csv'
                                     .format(s=start_date, e=end_date, n=datetime.now().strftime('%Y-%m-%d')))
    agg_by_general.to_csv(file_general_data, index=False)
    log.info('General aggregated data was saved in {f}'.format(f=file_general_data))
