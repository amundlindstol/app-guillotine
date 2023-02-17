package com.enonic.app.guillotine.mapper;

import com.enonic.xp.aggregation.Aggregations;
import com.enonic.xp.highlight.HighlightedProperties;
import com.enonic.xp.highlight.HighlightedProperty;
import com.enonic.xp.node.FindNodesByMultiRepoQueryResult;
import com.enonic.xp.node.MultiRepoNodeHit;
import com.enonic.xp.node.MultiRepoNodeHits;
import com.enonic.xp.query.QueryExplanation;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public class MultiRepoQueryResultMapper
    implements MapSerializable
{
    private final MultiRepoNodeHits nodeHits;

    private final long total;

    private final Aggregations aggregations;

    public MultiRepoQueryResultMapper( final FindNodesByMultiRepoQueryResult result )
    {
        this.nodeHits = result.getNodeHits();
        this.total = result.getTotalHits();
        this.aggregations = result.getAggregations();
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        gen.value( "total", this.total );
        gen.value( "count", this.nodeHits.getSize() );
        serialize( gen, this.nodeHits );
        serialize( gen, aggregations );
    }

    private void serialize( final MapGenerator gen, final MultiRepoNodeHits nodeHits )
    {
        gen.array( "hits" );
        for ( MultiRepoNodeHit nodeHit : nodeHits )
        {
            gen.map();
            gen.value( "id", nodeHit.getNodeId() );
            gen.value( "score", Float.isNaN( nodeHit.getScore() ) ? 0.0 : nodeHit.getScore() );
            gen.value( "repoId", nodeHit.getRepositoryId().toString() );
            gen.value( "branch", nodeHit.getBranch().getValue() );
            serialize( gen, nodeHit.getExplanation() );
            serialize( gen, nodeHit.getHighlight() );
            gen.end();
        }
        gen.end();
    }

    void serialize( final MapGenerator gen, final Aggregations aggregations )
    {
        if ( aggregations != null )
        {
            gen.map( "aggregations" );
            new AggregationMapper( aggregations ).serialize( gen );
            gen.end();
        }
    }

    void serialize( final MapGenerator gen, final HighlightedProperties highlightedProperties )
    {
        if ( highlightedProperties != null && !highlightedProperties.isEmpty() )
        {
            gen.map( "highlight" );
            for ( HighlightedProperty highlightedProperty : highlightedProperties )
            {
                gen.array( highlightedProperty.getName() );
                for ( String fragment : highlightedProperty.getFragments() )
                {
                    gen.value( fragment );
                }
                gen.end();
            }
            gen.end();
        }
    }

    void serialize( final MapGenerator gen, final QueryExplanation explanation )
    {
        if ( explanation != null )
        {
            gen.map( "explanation" );
            doAddExplanation( gen, explanation );
            gen.end();
        }
    }

    private void doAddExplanation( final MapGenerator gen, final QueryExplanation explanation )
    {
        gen.value( "value", explanation.getValue() );
        gen.value( "description", explanation.getDescription() );
        gen.array( "details" );
        for ( final QueryExplanation detail : explanation.getDetails() )
        {
            gen.map();
            doAddExplanation( gen, detail );
            gen.end();
        }
        gen.end();
    }

}
